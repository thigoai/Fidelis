import { auth, db } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';


auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("Usuário logado:", user.email);

        const profilePicture = document.getElementById('profilePicture');
        const profileText = document.querySelector('.profile-container .dropdown-menu li:first-child a');

        profileText.textContent = `Meu Perfil (${user.displayName || user.email})`;

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.photoUrl) {
                    profilePicture.src = userData.photoUrl; 
                } else {
                    profilePicture.src = "default-profile.png"; 
                }
            } else {
                console.warn("Documento do usuário não encontrado.");
                profilePicture.src = "default-profile.png"; 
            }
        } catch (error) {
            console.error("Erro ao obter os dados do usuário:", error);
            profilePicture.src = "default-profile.png"; 
        }
    } else {
        console.log("Nenhum usuário logado. Redirecionando para a página de login.");
        window.location.href = "login.html";
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');

    if (!logoutButton) {
        console.error("Botão de logout não encontrado no DOM. Verifique o ID no HTML.");
        return; 
    }

    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            console.log("Tentando deslogar o usuário...");
            await auth.signOut();
            console.log("Logout bem-sucedido!");
            window.location.href = "login.html"; 
        } catch (error) {
            console.error("Erro ao deslogar o usuário:", error.message);
            alert("Erro ao deslogar: " + error.message);
        }
    });
});


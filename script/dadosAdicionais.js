import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

// Captura o UID do usuário da URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');

const form = {
    profileName: () => document.getElementById('profileName'),
    cpf: () => document.getElementById('cpf'),
    phone: () => document.getElementById('phone')
};

async function saveAdditionalData(event) {
    event.preventDefault();

    const profileName = form.profileName().value;
    const cpf = form.cpf().value;
    const phone = form.phone().value;

    try {
        // Salva os dados adicionais no Firestore
        await setDoc(doc(db, "users", uid), {
            profileName: profileName,
            cpf: cpf,
            phone: phone,
            photoUrl: ""
        });

        alert('Dados salvos com sucesso!');
        // Redirecionar para a página inicial ou outra página
        window.location.href = "/Usuario/hub.html";
    } catch (error) {
        console.error('Erro ao salvar os dados:', error.message);
        alert('Erro ao salvar os dados: ' + error.message);
    }
}

// Listener no formulário
document.getElementById('additionalDataForm').addEventListener('submit', saveAdditionalData);

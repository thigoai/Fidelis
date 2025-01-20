import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

// Captura o UID do usuário da URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');

const form = {
    profileName: () => document.getElementById('profileName'),
    cpf: () => document.getElementById('cpf'),
    phone: () => document.getElementById('phone'),
    photo: () => document.getElementById('photo'),
};

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // Retorna a string Base64
        reader.onerror = reject; // Captura erros durante a leitura
        reader.readAsDataURL(file); // Converte a imagem para Base64
    });
}

async function saveAdditionalData(event) {
    event.preventDefault();

    const profileName = form.profileName().value;
    const cpf = form.cpf().value;
    const phone = form.phone().value;
    const photoFile = form.photo().files[0]; // Obtém o arquivo de imagem
    let photoBase64 = "";

    try {
        // Converte a imagem para Base64, se houver
        if (photoFile) {
            photoBase64 = await convertImageToBase64(photoFile);
        }

        // Salva os dados adicionais no Firestore
        await setDoc(doc(db, "users", uid), {
            profileName: profileName,
            cpf: cpf,
            phone: phone,
            photoUrl: photoBase64, // Armazena a imagem como Base64
        });

        alert('Dados salvos com sucesso!');
        window.location.href = "hub.html";
    } catch (error) {
        console.error('Erro ao salvar os dados:', error.message);
        alert('Erro ao salvar os dados: ' + error.message);
    }
}

// Listener no formulário
document.getElementById('additionalDataForm').addEventListener('submit', saveAdditionalData);

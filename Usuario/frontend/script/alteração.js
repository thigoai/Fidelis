import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { updateProfile, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { auth, db } from './firebase.js';  // Certifique-se de que db está sendo importado

document.addEventListener('DOMContentLoaded', function () {
    // Atualizar dados pessoais
    const formInformacoesPessoais = document.querySelector('#editar-informacoes-pessoais form');
    if (formInformacoesPessoais) {
        formInformacoesPessoais.addEventListener('submit', async function(event) {
            event.preventDefault();

            const nomeCompleto = document.querySelector('#nome-completo').value.trim();
            const cpf = document.querySelector('#cpf').value.trim();

            if (nomeCompleto && cpf) {
                const user = auth.currentUser;
                if (user) {
                    const userRef = doc(db, 'users', user.uid);  // Certifique-se de que a coleção 'users' existe

                    try {
                        // Atualizar dados no Firestore
                        await updateDoc(userRef, {
                            profileName: nomeCompleto,  // Salvando o nome completo como 'profileName'
                            cpf: cpf                    // Salvando o CPF
                        });

                        alert("Dados atualizados com sucesso!");
                    } catch (error) {
                        console.error("Erro ao atualizar dados:", error);
                        alert("Erro ao atualizar dados.");
                    }
                }
            } else {
                alert("Preencha todos os campos.");
            }
        });
    }

    // Alterar foto de perfil
    const btnAlterarFoto = document.querySelector('#btn-alterar-foto');
    if (btnAlterarFoto) {
        btnAlterarFoto.addEventListener('click', function() {
            document.querySelector('#upload-foto').click();
        });
    }

    const uploadFoto = document.querySelector('#upload-foto');
    if (uploadFoto) {
        uploadFoto.addEventListener('change', function(event) {
            const file = event.target.files[0];
    
            if (file) {
                const reader = new FileReader();
    
                reader.onloadend = async function() {
                    const base64Image = reader.result;
    
                    try {
                        const user = auth.currentUser;
                        if (user) {
                            // Função para tentar atualizar a foto de perfil novamente
                            const updateProfileWithRetry = async (retries = 3) => {
                                try {
                                    await updateProfile(user, {
                                        photoURL: base64Image
                                    });
                                    document.querySelector('#foto-perfil').src = base64Image;
    
                                    const userRef = doc(db, 'users', user.uid);
                                    await updateDoc(userRef, {
                                        photoUrl: base64Image
                                    });
    
                                    alert("Foto de perfil atualizada com sucesso!");
                                } catch (error) {
                                    if (error.code === 'auth/timeout' && retries > 0) {
                                        console.log(`Tentando novamente... (${retries} tentativas restantes)`);
                                        await updateProfileWithRetry(retries - 1);
                                    } else {
                                        console.error("Erro ao carregar a foto:", error);
                                        alert("Erro ao carregar a foto. Tente novamente mais tarde.");
                                    }
                                }
                            };
    
                            // Tenta atualizar o perfil
                            await updateProfileWithRetry();
                        }
                    } catch (error) {
                        if (error.code === 'auth/network-request-failed') {
                            console.error("Erro de rede. Verifique sua conexão e tente novamente.");
                            alert("Erro de rede. Verifique sua conexão e tente novamente.");
                        } else {
                            console.error("Erro ao carregar a foto:", error);
                            alert("Erro ao carregar a foto.");
                        }
                    }
                };
    
                reader.readAsDataURL(file);  // Converte a imagem para Base64
            }
        });
    }
    


    // Atualizar dados de contato (email e telefone)
    const formContato = document.querySelector('#editar-contato-form');
    if (formContato) {
        formContato.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = document.querySelector('#email').value.trim();
            const telefone = document.querySelector('#telefone').value.trim();

            if (email && telefone) {
                const user = auth.currentUser;
                if (user) {
                    try {
                        // Atualizar email no Firebase Authentication
                        await updateEmail(user, email);

                        // Atualizar telefone no Firestore
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, {
                            phone: telefone  // Salvando o telefone
                        });

                        alert("Dados de contato atualizados com sucesso!");
                    } catch (error) {
                        console.error("Erro ao atualizar dados de contato:", error);
                        alert("Erro ao atualizar dados de contato.");
                    }
                }
            } else {
                alert("Preencha todos os campos.");
            }
        });
    }

    // Atualizar a senha
    const formCredenciais = document.querySelector('#editar-credenciais-form');
    if (formCredenciais) {
        formCredenciais.addEventListener('submit', async function(event) {
            event.preventDefault();

            const senhaAtual = document.querySelector('#senha-atual').value.trim();
            const novaSenha = document.querySelector('#nova-senha').value.trim();
            const confirmarSenha = document.querySelector('#confirmar-senha').value.trim();

            if (senhaAtual && novaSenha && novaSenha === confirmarSenha) {
                const user = auth.currentUser;
                if (user) {
                    try {
                        // Verificar se a senha atual está correta
                        const credential = firebase.auth.EmailAuthProvider.credential(user.email, senhaAtual);
                        await user.reauthenticateWithCredential(credential); // Reautenticação necessária para alterar a senha

                        // Atualizar senha no Firebase Authentication
                        await updatePassword(user, novaSenha);

                        alert("Senha atualizada com sucesso!");
                    } catch (error) {
                        console.error("Erro ao atualizar a senha:", error);
                        alert("Erro ao atualizar a senha.");
                    }
                }
            } else {
                alert("Verifique os campos de senha e tente novamente.");
            }
        });
    }
});

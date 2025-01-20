// Inicialização do Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAmoz2sG3pyOFEQ_OqwsDZ-tMiWaSa3Qdw",
    authDomain: "fidelis-59ca9.firebaseapp.com",
    projectId: "fidelis-59ca9",
});

const db = firebase.firestore();

// Função para carregar postagens do Firestore
const loadPosts = () => {
    const feed = document.querySelector('.feed');
    feed.innerHTML = ''; // Limpar o feed antes de recarregar

    db.collection('posts').orderBy('createdAt', 'desc').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const postHtml = `
                    <div class="post">
                        <img src="${data.imageUrl}" alt="Imagem da postagem" class="post-image">
                        <div class="post-content">
                            <h3 class="post-title">${data.title}</h3>
                            <p class="post-description">${data.description}</p>
                            <div class="post-actions">
                                <button class="like-button">Curtir</button>
                                <button class="share-button">Compartilhar</button>
                            </div>
                        </div>
                    </div>`;
                feed.innerHTML += postHtml;
            });
        })
        .catch((error) => console.error('Erro ao carregar postagens:', error));
};

// Carregar postagens ao iniciar
loadPosts();

function carregarProgressoCliente(clienteNome, programaId) {
    const programasRef = db.collection('programas').doc(programaId);

    programasRef.get().then((doc) => {
        if (doc.exists) {
            const programa = doc.data();
            const cliente = programa.clientes.find(c => c.nome.toLowerCase() === clienteNome.toLowerCase());

            if (cliente) {
                // Exibir informações do cliente
                document.getElementById('cliente-pontos').textContent = cliente.pontos;
                document.getElementById('cliente-meta').textContent = cliente.meta;
                document.getElementById('cliente-status').textContent = cliente.resgatado ? 'Recompensa já resgatada!' : 'Meta ainda não atingida';
                
                // Exibir a recompensa do cliente
                document.getElementById('recompensa-nome').textContent = cliente.recompensa || 'Recompensa não definida';

                // Atualizar visibilidade do botão de resgate
                const resgatarButton = document.getElementById('resgatar-button');
                if (cliente.pontos >= cliente.meta && !cliente.resgatado) {
                    resgatarButton.style.display = 'block';
                    resgatarButton.disabled = false;
                } else {
                    resgatarButton.style.display = 'block';
                    resgatarButton.disabled = true;
                }
            } else {
                console.error('Cliente não encontrado.');
            }
        } else {
            console.error('Programa não encontrado.');
        }
    }).catch((error) => {
        console.error('Erro ao buscar dados do programa:', error);
    });
}


// Exemplo de uso
const clienteNome = ""; // Substitua pelo nome do cliente atual
const programaId = "programaId1"; // Substitua pelo ID do programa de fidelidade
carregarProgressoCliente(clienteNome, programaId);

function resgatarRecompensa() {
   
    if (!clienteNome || !programaId) {
        alert("Erro: Cliente ou programa de fidelidade não identificado.");
        return;
    }

    const programasRef = db.collection('programas').doc(programaId);

    programasRef.get().then((doc) => {
        if (doc.exists) {
            const programa = doc.data();
            const clienteIndex = programa.clientes.findIndex(c => c.nome.toLowerCase() === clienteNome.toLowerCase());

            if (clienteIndex >= 0) {
                const cliente = programa.clientes[clienteIndex];

                if (cliente.pontos >= cliente.meta && !cliente.resgatado) {
                    // Atualizar o status do cliente
                    programa.clientes[clienteIndex].resgatado = true;

                    programasRef.update({
                        clientes: programa.clientes
                    }).then(() => {
                        alert("Recompensa resgatada com sucesso!");
                        document.getElementById('cliente-status').textContent = 'Recompensa já resgatada!';
                        document.getElementById('resgatar-button').style.display = 'none';
                    }).catch((error) => {
                        console.error("Erro ao atualizar o programa:", error);
                        alert("Erro ao resgatar recompensa. Tente novamente.");
                    });
                } else if (cliente.resgatado) {
                    alert("Recompensa já foi resgatada!");
                } else {
                    alert("Meta ainda não atingida. Continue acumulando pontos!");
                }
            } else {
                alert("Cliente não encontrado no programa de fidelidade.");
            }
        } else {
            alert("Programa de fidelidade não encontrado.");
        }
    }).catch((error) => {
        console.error("Erro ao buscar programa:", error);
        alert("Erro ao acessar dados do programa. Tente novamente.");
    });
}

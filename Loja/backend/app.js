// Inicialização do Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAmoz2sG3pyOFEQ_OqwsDZ-tMiWaSa3Qdw",
    authDomain: "fidelis-59ca9.firebaseapp.com",
    projectId: "fidelis-59ca9",
});

const db = firebase.firestore();

// Referência à coleção "posts"
//const postsRef = db.collection('postagens');

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
  
  // Função para criar uma nova postagem
  document.getElementById('create-post-form').addEventListener('submit', (e) => {
    e.preventDefault();
  
    const title = document.getElementById('post-title').value;
    const description = document.getElementById('post-description').value;
    const imageUrl = 'https://via.placeholder.com/150'; // Substituir pelo upload de imagem, se necessário
  
    db.collection('posts').add({
      title,
      description,
      imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      alert('Postagem criada com sucesso!');
      document.getElementById('create-post-form').reset(); // Limpa o formulário
      loadPosts(); // Recarrega o feed
    }).catch((error) => {
      console.error('Erro ao criar postagem:', error);
    });
  });

  function carregarProgressoClientes() {
    const programasRef = db.collection('programas');

    // Buscar todos os documentos na coleção "programas"
    programasRef.get().then((querySnapshot) => {
        const programasContainer = document.getElementById('progresso'); // Container para exibir programas
        programasContainer.innerHTML = ''; // Limpa o container

        querySnapshot.forEach((doc) => {
            const programa = doc.data();
            const clientes = programa.clientes || []; // Verificar se há clientes cadastrados

            // Cria um título para o programa
            const programaTitulo = document.createElement('h3');
            programaTitulo.textContent = programa.nome || 'Programa sem nome';
            programasContainer.appendChild(programaTitulo);

            // Cria uma tabela para exibir os clientes do programa
            const tabela = document.createElement('table');
            tabela.classList.add('programa-progresso');
            tabela.innerHTML = `
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Pontos</th>
                        <th>Meta</th>
                        <th>Progresso</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Dados dos clientes serão inseridos aqui -->
                </tbody>
            `;
            programasContainer.appendChild(tabela);

            const tabelaBody = tabela.querySelector('tbody');
            clientes.forEach(cliente => {
                const progresso = Math.min((cliente.pontos / cliente.meta) * 100, 100); // Cálculo do progresso
                const status = cliente.resgatado
                    ? '<span class="status-resgatado">Recompensa Resgatada</span>'
                    : (progresso === 100
                        ? '<span class="status-disponivel">Disponível para Resgate</span>'
                        : '<span class="status-incompleto">Meta Não Atingida</span>');

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cliente.nome}</td>
                    <td>${cliente.pontos}</td>
                    <td>${cliente.meta}</td>
                    <td>
                      <div class="progress-bar">
                        <div class="progress" style="width: ${progresso}%;"></div>
                      </div>
                      <span>${progresso.toFixed(1)}%</span>
                    </td>
                    <td>${status}</td>
                `;
                tabelaBody.appendChild(tr);
            });
        });
    }).catch((error) => {
        console.error('Erro ao carregar programas:', error);
    });
}




// Função para adicionar cliente
function addClient(event) {
    event.preventDefault(); // Previne o comportamento padrão do formulário
    
    const clientName = document.getElementById('client-name').value;
    const clientPoints = parseInt(document.getElementById('client-points').value);
    const clientGoal = parseInt(document.getElementById('client-goal').value);

    if (!clientName || isNaN(clientPoints) || isNaN(clientGoal)) {
        alert('Preencha todos os campos corretamente!');
        return;
    }

    const programasRef = db.collection('programas');
    
    programasRef.doc('cafe_free').update({
        clientes: firebase.firestore.FieldValue.arrayUnion({
            nome: clientName,
            pontos: clientPoints,
            meta: clientGoal
        })
    }).then(() => {
        alert('Cliente adicionado com sucesso!');
        carregarProgressoClientes();
        document.getElementById('add-client-form').reset();
    }).catch((error) => {
        console.error('Erro ao adicionar cliente:', error);
    });
}

// Função para carregar o ranking dos clientes
function carregarRanking() {
    db.collection("clientes")
        .orderBy("pontos", "desc")
        .limit(10)
        .get()
        .then((querySnapshot) => {
            let ranking = '';
            let posicao = 1;

            querySnapshot.forEach((doc) => {
                const cliente = doc.data();
                const imagem = cliente.imagem ? `images/${cliente.imagem}` : 'images/default-avatar.png';

                ranking += `
                    <li class="position-${posicao}">
                        <span class="position">${posicao}</span>
                        <img src="${imagem}" alt="${cliente.nome}">
                        <p>${cliente.nome}</p>
                        <span class="points">${cliente.pontos} pontos</span>
                    </li>
                `;
                posicao++;
            });

            document.querySelector('.ranking-container .podium ul').innerHTML = ranking;
        })
        .catch((error) => {
            console.error("Erro ao carregar o ranking: ", error);
        });
}

// Adicionando eventos e carregando os dados ao iniciar
window.onload = () => {
    carregarProgressoClientes();
    carregarRanking();

    // Evento para adicionar cliente
    document.getElementById('add-client-form').addEventListener('submit', addClient);
};
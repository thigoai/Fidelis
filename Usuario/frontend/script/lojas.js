function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id"); // Retorna o valor do parâmetro "id"
  }
  
  // Obter o ID da loja
  const lojaId = getUrlParams();
  if (!lojaId) {
    alert("Loja não encontrada!");
    window.location.href = "hub.html"; // Redirecionar para a página inicial
  }
  
  // Carregar dados da loja
  async function carregarDadosLoja() {
    try {
      const lojaRef = db.collection("Lojas").doc(lojaId); // Ajuste para o nome da sua coleção
      const lojaDoc = await lojaRef.get();
  
      if (lojaDoc.exists) {
        const loja = lojaDoc.data();
  
        // Atualizar o título e as informações da loja
        document.getElementById("nome-loja").textContent = loja.nome || "Nome da Loja";
        document.querySelector(".feature-icon").src = loja.imagem || "./images/default.jpg";
  
        // Adicionar outros dados como novidades ou progresso
        carregarNovidades(lojaId);
        carregarProgresso(lojaId);
        carregarRanking(lojaId);
      } else {
        alert("Loja não encontrada no banco de dados!");
        window.location.href = "hub.html"; // Redirecionar para a página inicial
      }
    } catch (error) {
      console.error("Erro ao carregar os dados da loja:", error);
    }
  }
  
  // Carregar novidades da loja
  async function carregarNovidades(lojaId) {
    const novidadesContainer = document.querySelector("#novidades .feed");
    try {
      const novidadesRef = db.collection("Lojas").doc(lojaId).collection("Novidades");
      const snapshot = await novidadesRef.get();
  
      novidadesContainer.innerHTML = ""; // Limpa o conteúdo anterior
      snapshot.forEach(doc => {
        const novidade = doc.data();
        const post = document.createElement("div");
        post.classList.add("novidade");
        post.innerHTML = `
          <h3>${novidade.titulo || "Título"}</h3>
          <p>${novidade.descricao || "Descrição não disponível."}</p>
        `;
        novidadesContainer.appendChild(post);
      });
    } catch (error) {
      console.error("Erro ao carregar novidades:", error);
    }
  }
  
  // Funções adicionais para carregar progresso e ranking
  async function carregarProgresso(lojaId) {
    // Exemplo básico para progresso
    const progressoInfo = document.getElementById("cliente-info");
    progressoInfo.querySelector("#recompensa-nome").textContent = "Recompensa Exemplo";
    progressoInfo.querySelector("#cliente-pontos").textContent = "10";
    progressoInfo.querySelector("#cliente-meta").textContent = "100";
    progressoInfo.querySelector("#cliente-status").textContent = "Em progresso...";
  }
  
  async function carregarRanking(lojaId) {
    // Exemplo para ranking
    const rankingContainer = document.querySelector("#ranking .ranking-container .podium ul");
    rankingContainer.innerHTML = `
      <li>1º - João (50 pontos)</li>
      <li>2º - Maria (30 pontos)</li>
      <li>3º - Pedro (20 pontos)</li>
    `;
  }
  
  // Carregar dados da loja ao carregar a página
  document.addEventListener("DOMContentLoaded", carregarDadosLoja);
const lojas = {
    loja1: {
        nome: "Café do Centro",
        programas: [
            {
                nome: "Programa de Café",
                progresso: 5,
                maxCarimbos: 10
            },
            {
                nome: "Programa VIP",
                progresso: 3,
                maxCarimbos: 10
            }
        ]
    },
    loja2: {
        nome: "Livraria Saber",
        programas: [
            {
                nome: "Leitor Frequente",
                progresso: 7,
                maxCarimbos: 12
            }
        ]
    }
};



// Função para obter o parâmetro "id" da URL
function getLojaID() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// Atualizar os dados da página com base na loja
function atualizarLoja() {
    const lojaID = getLojaID();
    const loja = lojas[lojaID];

    if (!loja) {
        console.error("Loja não encontrada!");
        return;
    }

    // Atualizar informações no DOM
    document.querySelector(".shop-info h2").textContent = loja.nome;
    document.querySelector(".shop-info p:nth-child(2)").textContent = `Categoria: ${loja.categoria}`;
    document.querySelector(".shop-info p:nth-child(3)").textContent = `Localização: ${loja.localizacao}`;
    document.querySelector(".shop-info p:nth-child(4)").textContent = `Horário: ${loja.horario}`;
    document.querySelector(".shop-description p").textContent = loja.descricao;
    document.querySelector(".progress-bar").style.width = `${(loja.carimbos / loja.totalCarimbos) * 100}%`;
    document.querySelector(".progress-bar").textContent = `${loja.carimbos}/${loja.totalCarimbos} carimbos`;
    document.querySelector(".banner-image").src = loja.banner;
    document.querySelector(".shop-logo").src = loja.logo;
}

// Chamar a função ao carregar a página
document.addEventListener("DOMContentLoaded", atualizarLoja);

function mostrarSubpagina(subpaginaId) {
    const subpaginas = document.querySelectorAll('.subpagina');
    subpaginas.forEach(subpagina => {
        subpagina.classList.remove('active');
    });

    document.getElementById(subpaginaId).classList.add('active');
}


// Carregar a primeira subpágina como ativa (Novidades, por exemplo)
document.addEventListener('DOMContentLoaded', () => {
    mostrarSubpagina('novidades');
});

// Interação com os botões
document.querySelectorAll('.like-button').forEach(button => {
    button.addEventListener('click', () => {
        alert('Você curtiu esta novidade!');
    });
});

document.querySelectorAll('.share-button').forEach(button => {
    button.addEventListener('click', () => {
        alert('Link para compartilhamento copiado!');
    });
});

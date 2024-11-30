// Mostrar e ocultar barra de pesquisa
const searchLink = document.getElementById('search-link');
const searchBar = document.getElementById('search-bar');

searchLink.addEventListener('click', function (event) {
    event.preventDefault();
    searchBar.style.display = searchBar.style.display === 'block' ? 'none' : 'block';
});

// Coloca os itens pro lado
function scrollCarousel(carouselId, direction) {
    const carousel = document.getElementById(carouselId);
    const scrollAmount = carousel.offsetWidth / 2; 
    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth',
    });
}

// Para fazer os itens redirecionar para o link da loja
const items = document.querySelectorAll(".item");
const favoriteItems = document.querySelectorAll(".favorite-item");
const promoItems = document.querySelectorAll(".promo-item");

items.forEach(item => {
  item.addEventListener("click", (event) => {
      const isModalTarget = event.target.closest(".item") && modal;
      if (isModalTarget) {
          const details = `<p>Detalhes do item ${item.getAttribute("data-id")}</p>`;
          showModal(details);
          event.preventDefault();
      } else {
          const link = item.getAttribute("data-link");
          if (link) {
              window.location.href = link;
          }
      }
  });
});


favoriteItems.forEach(favoriteItem => {
  favoriteItem.addEventListener("click", () => {
    const link = favoriteItem.getAttribute("data-link");
    if (link) {
      window.location.href = link;
    }
  });
});

promoItems.forEach(promoItem => {
  promoItem.addEventListener("click", () => {
    const link = promoItem.getAttribute("data-link");
    if (link) {
      window.location.href = link;
    }
  });
});

// Atualiza a visibilidade dos botões de rolagem
function updateScrollButtons(carouselId, prevBtnId, nextBtnId) {
    const carousel = document.getElementById(carouselId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);

    if (carousel.scrollLeft === 0) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
    }

    if (carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth) {
        nextBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'block';
    }
}

function scrollCarousel(carouselId, direction, prevBtnId, nextBtnId) {
    const carousel = document.getElementById(carouselId);
    const scrollAmount = carousel.offsetWidth / 2;

    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth',
    });

    setTimeout(() => updateScrollButtons(carouselId, prevBtnId, nextBtnId), 300);
}

document.addEventListener("DOMContentLoaded", () => {
    const carousels = [
        { carouselId: 'carousel1', prevBtnId: 'prev1', nextBtnId: 'next1' },
        { carouselId: 'carousel2', prevBtnId: 'prev2', nextBtnId: 'next2' },
        { carouselId: 'carousel3', prevBtnId: 'prev3', nextBtnId: 'next3' }
    ];

    carousels.forEach(({ carouselId, prevBtnId, nextBtnId }) => {
        updateScrollButtons(carouselId, prevBtnId, nextBtnId);

        const carousel = document.getElementById(carouselId);
        carousel.addEventListener("scroll", () => {
            updateScrollButtons(carouselId, prevBtnId, nextBtnId);
        });
    });
});


const modal = document.getElementById("modal");
const modalContent = document.querySelector(".modal-content");
const closeModalBtn = document.querySelector(".close-btn");

function showModal(content) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  
  modalBody.innerHTML = `
    <div class="modal-header">
      <h2>${content.title}</h2>
      <p>${content.description}</p>
    </div>
    <div class="modal-pricing">
      <span class="price-now">R$ ${content.currentPrice}</span>
      <span class="price-old">R$ ${content.oldPrice}</span>
    </div>
    <div class="modal-store">
      <p><strong>${content.storeName}</strong></p>
      <p>${content.deliveryTime} • ${content.deliveryCost}</p>
    </div>
    <div class="modal-options">
      <h3>Escolha o seu primeiro Sub</h3>
      <p>${content.optionsDescription}</p>
      <ul>
        ${content.options.map(
          (option, index) => `
          <li>
            <input type="radio" id="option${index}" name="option" value="${option}">
            <label for="option${index}">${option}</label>
          </li>`
        ).join('')}
      </ul>
    </div>
    <div class="modal-footer">
      <div class="quantity">
        <button class="btn-decrease">-</button>
        <input type="number" value="1" min="1">
        <button class="btn-increase">+</button>
      </div>
      <button class="btn-add">Adicionar • R$ ${content.currentPrice}</button>
    </div>
  `;


  modal.classList.remove("hidden");

  document.getElementById("close-modal").addEventListener("click", hideModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      hideModal();
    }
  });
}

function hideModal() {
  document.getElementById("modal").classList.add("hidden");
}

const exampleContent = {
  title: "Um cafézin gostoso juntamente com um Sonho",
  description: "Leve dois os com um desconto especial!",
  currentPrice: "2,50",
  oldPrice: "4,50",
  storeName: "CAFÉ IMD",
  deliveryTime: "40-50 min",
  deliveryCost: "Grátis",
  optionsDescription: "Escolha 1 opção.",
  options: [
    "Café + Sonho.",
    "Café + Cookie."
  ]
};

// Exemplo de chamada para exibir o modal
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".item");
  items.forEach(item => {
    item.addEventListener("click", () => showModal(exampleContent));
  });
});

// Fechar o modal
function closeModal() {
    modal.classList.add("hidden");
}

// Fechar ao clicar no botão de fechar
closeModalBtn.addEventListener("click", closeModal);

// Fechar ao clicar fora do conteúdo do modal
modal.addEventListener("click", (event) => {
    if (!modalContent.contains(event.target)) {
        closeModal();
    }
});



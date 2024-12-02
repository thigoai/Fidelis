// Mostrar e ocultar barra de pesquisa
const searchLink = document.getElementById('search-link');
const searchBar = document.getElementById('search-bar');

searchLink.addEventListener('click', function (event) {
    event.preventDefault();
    searchBar.style.display = searchBar.style.display === 'block' ? 'none' : 'block';
});

document.getElementById("search-bar").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
      const termoPesquisa = event.target.value.trim();
      if (termoPesquisa) {
          window.location.href = `resultado.html?query=${encodeURIComponent(termoPesquisa)}`;
      }
  }
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
  item.addEventListener("click", () => showModal(exampleContent));
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



function showModal(content) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  modalBody.innerHTML = `
    <div class="modal-image">
        <img src="${content.image}" alt="${content.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px 0 0 8px;">
    </div>
    <div class="modal-details">
        <h2 class="modal-header">${content.title}</h2>
        <div class="modal-store">
            <p><strong>${content.storeName}</strong></p>
        </div>
        <p class="modal-description">${content.description}</p>
        <div class="modal-pricing">
            <span class="price-now">R$ ${content.currentPrice}</span>
            <span class="price-old">R$ ${content.oldPrice}</span>
        </div>
        
    </div>
  `;


  modal.classList.add("show");
}


function hideModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("show");
}

document.getElementById("close-modal").addEventListener("click", hideModal);
document.getElementById("modal").addEventListener("click", (event) => {
  const modalContent = document.querySelector(".modal-content");
  if (!modalContent.contains(event.target)) {
    hideModal();
  }
});

const exampleContent = {
  title: "Um cafézin gostoso juntamente com um Sonho",
  description: "Leve dois os com um desconto especial!",
  currentPrice: "2,50",
  oldPrice: "4,50",
  storeName: "CAFÉ IMD",
  image: "../images/modal.png"
};


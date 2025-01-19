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








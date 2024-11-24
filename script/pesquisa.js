// Mostrar e ocultar barra de pesquisa
const searchLink = document.getElementById('search-link');
const searchBar = document.getElementById('search-bar');

searchLink.addEventListener('click', function (event) {
    event.preventDefault();
    searchBar.style.display = searchBar.style.display === 'block' ? 'none' : 'block';
});

function scrollCarousel(carouselId, direction) {
    const carousel = document.getElementById(carouselId);
    const scrollAmount = carousel.offsetWidth / 2; // Rola metade da largura visível
    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth',
    });
}

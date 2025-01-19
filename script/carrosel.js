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
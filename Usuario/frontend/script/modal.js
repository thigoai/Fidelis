const itemData = [
  {
    id: 1,
    title: "Café com Leite",
    description: "Desfrute de um delicioso café com leite feito na hora.",
    currentPrice: "5,00",
    oldPrice: "8,00",
    storeName: "Café IMD",
    image: "./images/item1.png"
  },
  {
    id: 2,
    title: "Sonho de Chocolate",
    description: "Um sonho recheado com o melhor chocolate. Irresistível!",
    currentPrice: "3,50",
    oldPrice: "5,00",
    storeName: "Café IMD",
    image: "./images/item2.png"
  },
  {
    id: 3,
    title: "Cappuccino Gelado",
    description: "Refresque-se com um cappuccino gelado, perfeito para o verão.",
    currentPrice: "7,50",
    oldPrice: "10,00",
    storeName: "Café IMD",
    image: "./images/item3.png"
  },
  {
    id: 4,
    title: "Bolo de Cenoura",
    description: "Bolo de cenoura fresquinho, uma combinação perfeita de sabor e maciez.",
    currentPrice: "6,00",
    oldPrice: "9,00",
    storeName: "Café IMD",
    image: "./images/item4.png"
  },
  {
    id: 5,
    title: "Salgadinho de Frango",
    description: "Salgadinho crocante e recheado com frango temperado, perfeito para qualquer momento.",
    currentPrice: "4,00",
    oldPrice: "6,00",
    storeName: "Café IMD",
    image: "./images/item5.png"
  },
  {
    id: 6,
    title: "Smoothie de Morango",
    description: "Um smoothie de morango cremoso, uma explosão de sabor a cada gole.",
    currentPrice: "8,00",
    oldPrice: "12,00",
    storeName: "Café IMD",
    image: "./images/item6.png"
  },
  {
    id: 7,
    title: "Pão de Queijo",
    description: "Pão de queijo fresquinho, com a textura perfeita e sabor irresistível.",
    currentPrice: "3,00",
    oldPrice: "4,50",
    storeName: "Café IMD",
    image: "./images/item7.png"
  },
  {
    id: 8,
    title: "Torta de Limão",
    description: "Torta de limão com recheio cremoso e crosta crocante. Um doce para todos os gostos.",
    currentPrice: "9,00",
    oldPrice: "12,00",
    storeName: "Café IMD",
    image: "./images/item8.png"
  },
  {
    id: 9,
    title: "Chá Gelado",
    description: "Chá gelado refrescante com o sabor natural das ervas.",
    currentPrice: "4,50",
    oldPrice: "7,00",
    storeName: "Café IMD",
    image: "./images/item9.png"
  }
];

// Exemplo de exibição do modal com base no ID
document.querySelectorAll(".carousel .item").forEach((item) => {
  item.addEventListener("click", () => {
    const itemId = parseInt(item.getAttribute("data-id"), 10);
    const content = itemData.find((data) => data.id === itemId);

    if (content) {
      showModal(content);
    }
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

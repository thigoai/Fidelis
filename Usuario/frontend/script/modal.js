
items.forEach(item => {
    item.addEventListener("click", () => showModal(exampleContent));
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
document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.querySelector('.add-button');
    const cancelButton = document.querySelector('.cancel-button');
    const rewardsForm = document.querySelector('.rewards-form');
    const rewardsList = document.querySelector('.rewards-list');

    const categoryIcons = {
        produto: '<i class="fas fa-box"></i>',
        desconto: '<i class="fas fa-percent"></i>',
        brinde: '<i class="fas fa-gift"></i>',
        vale: '<i class="fas fa-ticket-alt"></i>',
        surpresa: '<i class="fas fa-magic"></i>',
    };

    let editingReward = null;

    // Mostrar o formulário ao clicar no botão de adicionar
    addButton.addEventListener('click', () => {
        rewardsForm.classList.remove('hidden');
        addButton.style.display = 'none';
        editingReward = null;  // Resetando a edição
    });

    // Ocultar o formulário ao clicar no botão de cancelar
    cancelButton.addEventListener('click', () => {
        rewardsForm.classList.add('hidden');
        addButton.style.display = 'inline-flex';
        editingReward = null;
    });

    // Salvar nova recompensa ou editar
    rewardsForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Capturar os valores do formulário
        const title = document.querySelector('#reward-title').value;
        const category = document.querySelector('#reward-category').value;
        const description = document.querySelector('#reward-description').value;

        if (editingReward) {
            // Editando a recompensa existente
            editingReward.querySelector('h3').innerHTML = `${categoryIcons[category]} ${title}`;
            editingReward.querySelector('p').innerHTML = `<i class="fas fa-tags"></i> Categoria: ${category.charAt(0).toUpperCase() + category.slice(1)}<br><i class="fas fa-info-circle"></i> ${description}`;
            editingReward = null;
        } else {
            // Criando uma nova recompensa
            const newReward = document.createElement('div');
            newReward.classList.add('reward-item');
            newReward.innerHTML = `
                <h3>${categoryIcons[category]} ${title}</h3>
                <p><i class="fas fa-tags"></i> Categoria: ${category.charAt(0).toUpperCase() + category.slice(1)}</p>
                <p><i class="fas fa-info-circle"></i> ${description}</p>
                <button class="edit-button"><i class="fas fa-edit"></i> Editar</button>
            `;

            // Adicionar à lista
            rewardsList.appendChild(newReward);

            // Adicionar evento para editar a recompensa
            newReward.querySelector('.edit-button').addEventListener('click', () => {
                // Preencher os campos com os dados da recompensa selecionada
                document.querySelector('#reward-title').value = title;
                document.querySelector('#reward-category').value = category;
                document.querySelector('#reward-description').value = description;
                rewardsForm.classList.remove('hidden');
                addButton.style.display = 'none';

                editingReward = newReward; // Definir qual recompensa está sendo editada
            });
        }

        // Resetar o formulário e voltar para o estado inicial
        rewardsForm.reset();
        rewardsForm.classList.add('hidden');
        addButton.style.display = 'inline-flex';
    });
});


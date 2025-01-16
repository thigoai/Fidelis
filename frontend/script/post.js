document.getElementById('create-post-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Capturar os valores do formulário
    const title = document.getElementById('post-title').value;
    const description = document.getElementById('post-description').value;
    const image = document.getElementById('post-image').files[0];

    // Criar um novo elemento de post
    const post = document.createElement('div');
    post.classList.add('post');

    if (image) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const postImage = document.createElement('img');
            postImage.src = e.target.result;
            postImage.classList.add('post-image');
            post.appendChild(postImage);
        };
        reader.readAsDataURL(image);
    }

    const postContent = document.createElement('div');
    postContent.classList.add('post-content');

    const postTitle = document.createElement('h3');
    postTitle.textContent = title;
    postTitle.classList.add('post-title');
    postContent.appendChild(postTitle);

    const postDescription = document.createElement('p');
    postDescription.textContent = description;
    postDescription.classList.add('post-description');
    postContent.appendChild(postDescription);

    const postActions = document.createElement('div');
    postActions.classList.add('post-actions');
    postActions.innerHTML = `
        <button class="like-button">Curtir</button>
        <button class="share-button">Compartilhar</button>
    `;
    postContent.appendChild(postActions);

    post.appendChild(postContent);

    // Adicionar o post ao feed
    document.querySelector('.feed').prepend(post);

    // Limpar o formulário
    document.getElementById('create-post-form').reset();
});

function cancelPost() {
    document.getElementById('create-post-form').reset();
}

const photoInput = document.getElementById('photo-input');
const photoPreview = document.querySelector('.photo-preview');

photoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            photoPreview.src = reader.result; 
        };
        reader.readAsDataURL(file);
    }
});

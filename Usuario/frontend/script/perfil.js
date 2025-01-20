// Clicando no perfil, ocorre algo agr :D
profilePicture.addEventListener('click', () => {

    dropdownMenu.style.display =
      dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });
  
  // Clicando algo sem ser o perfil, deixa de ocorrer algo agr ;_;
  document.addEventListener('click', (event) => {
    if (!profilePicture.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.style.display = 'none';
    }
  });


function abrirEdicao(secao) {
 
  document.getElementById('menu-dados').style.display = 'none';


  document.getElementById(`editar-${secao}`).style.display = 'block';
}


function voltarMenu() {
 
  document.querySelectorAll('[id^="editar-"]').forEach((form) => {
      form.style.display = 'none';
  });

 
  document.getElementById('menu-dados').style.display = 'block';
}

const btnAlterarFoto = document.getElementById('btn-alterar-foto');
const uploadFoto = document.getElementById('upload-foto');
const fotoPerfil = document.getElementById('foto-perfil');

btnAlterarFoto.addEventListener('click', () => {
    uploadFoto.click(); 
});


uploadFoto.addEventListener('change', (event) => {
    const file = event.target.files[0]; 
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            fotoPerfil.src = e.target.result; 
        };

        reader.readAsDataURL(file); 
    }
});
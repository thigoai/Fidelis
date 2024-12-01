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


